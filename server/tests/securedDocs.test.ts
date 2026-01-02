import nodeCrypto from 'crypto';

// Polyfill crypto.getRandomValues in test environment
if (typeof (globalThis as any).crypto !== 'object') {
  (globalThis as any).crypto = {};
}
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') {
  (globalThis as any).crypto.getRandomValues = (arr: Uint8Array) => nodeCrypto.randomFillSync(arr);
}

import express from 'express';
import request from 'supertest';
import securedDocsRouter from '../securedDocs.routes';

describe('Secured Docs API', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/secured-docs', securedDocsRouter);
  });

  it('send-upload-link -> returns uploadLinkId and link', async () => {
    const res = await request(app)
      .post('/api/secured-docs/send-upload-link')
      .send({ recipientEmail: 'r@example.com', recipientName: 'R', message: 'Please upload', expirationDays: 1, maxDownloads: 2, organizationId: 'org-test' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uploadLinkId');
    expect(res.body).toHaveProperty('uploadLink');
  });

  it('upload with valid uploadLinkId (no auth) -> creates document', async () => {
    const sendRes = await request(app)
      .post('/api/secured-docs/send-upload-link')
      .send({ recipientEmail: 'r2@example.com', recipientName: 'R2', expirationDays: 1, maxDownloads: 2, organizationId: 'org-test' });

    const { uploadLinkId } = sendRes.body;
    const uploadRes = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'doc.pdf', originalName: 'doc.pdf', senderName: 'Sender', senderEmail: 'sender@example.com', fileSize: 1024, fileType: 'pdf', uploadLinkId });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body).toHaveProperty('id');
    expect(uploadRes.body.filename).toBe('doc.pdf');
    expect(uploadRes.body.organizationId).toBe('org-test');
  });

  it('upload without uploadLinkId and without auth returns 401', async () => {
    const res = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'doc2.pdf', originalName: 'doc2.pdf', senderName: 'S', senderEmail: 's@example.com' });

    expect(res.status).toBe(401);
  });

  it('download tracking increments downloadCount', async () => {
    // create a document via the in-memory route
    const uploadRes = await request(app)
      .post('/api/secured-docs/send-upload-link')
      .send({ recipientEmail: 'r3@example.com', recipientName: 'R3', expirationDays: 1, maxDownloads: 5, organizationId: 'org-test' });

    const { uploadLinkId } = uploadRes.body;

    const docRes = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'download-me.pdf', originalName: 'download-me.pdf', senderName: 'Send', senderEmail: 'send@example.com', uploadLinkId });

    const docId = docRes.body.id;

    const dlRes1 = await request(app)
      .put(`/api/secured-docs/${docId}/download`)
      .send();

    expect(dlRes1.status).toBe(200);
    expect(dlRes1.body.downloadCount).toBe(1);

    const dlRes2 = await request(app)
      .put(`/api/secured-docs/${docId}/download`)
      .send();

    expect(dlRes2.status).toBe(200);
    expect(dlRes2.body.downloadCount).toBe(2);
  });
});

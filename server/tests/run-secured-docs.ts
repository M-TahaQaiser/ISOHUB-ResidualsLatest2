import nodeCrypto from 'crypto';

// Polyfill crypto.getRandomValues for environments that don't provide it
if (typeof (globalThis as any).crypto !== 'object') {
  (globalThis as any).crypto = {};
}
if (typeof (globalThis as any).crypto.getRandomValues !== 'function') {
  (globalThis as any).crypto.getRandomValues = (arr: Uint8Array) => nodeCrypto.randomFillSync(arr);
}

import express from 'express';
import request from 'supertest';
import securedDocsRouter from '../securedDocs.routes';
import assert from 'assert';

(async function run() {
  try {
    const app = express();
    app.use(express.json());
    app.use('/api/secured-docs', securedDocsRouter as any);

    console.log('Testing send-upload-link...');
    const sendRes = await request(app)
      .post('/api/secured-docs/send-upload-link')
      .send({ recipientEmail: 'r@example.com', recipientName: 'R', message: 'Please upload', expirationDays: 1, maxDownloads: 2, organizationId: 'org-test' });
    assert.strictEqual(sendRes.status, 200, 'send-upload-link should return 200');
    assert.ok(sendRes.body.uploadLinkId, 'uploadLinkId should be present');

    const { uploadLinkId } = sendRes.body;

    console.log('Testing unauthenticated upload with uploadLinkId...');
    const uploadRes = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'doc.pdf', originalName: 'doc.pdf', senderName: 'Sender', senderEmail: 'sender@example.com', fileSize: 1024, fileType: 'pdf', uploadLinkId });
    assert.strictEqual(uploadRes.status, 201, 'upload should return 201');
    assert.strictEqual(uploadRes.body.filename, 'doc.pdf');
    assert.strictEqual(uploadRes.body.organizationId, 'org-test');

    console.log('Testing upload without uploadLinkId should return 401');
    const uploadRes2 = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'doc2.pdf', originalName: 'doc2.pdf', senderName: 'S', senderEmail: 's@example.com' });
    assert.strictEqual(uploadRes2.status, 401);

    console.log('Testing download tracking increments count...');
    const uploadRes3 = await request(app)
      .post('/api/secured-docs/send-upload-link')
      .send({ recipientEmail: 'r3@example.com', recipientName: 'R3', expirationDays: 1, maxDownloads: 5, organizationId: 'org-test' });
    const uploadLinkId2 = uploadRes3.body.uploadLinkId;

    const docRes = await request(app)
      .post('/api/secured-docs/upload')
      .send({ filename: 'download-me.pdf', originalName: 'download-me.pdf', senderName: 'Send', senderEmail: 'send@example.com', uploadLinkId: uploadLinkId2 });
    const docId = docRes.body.id;

    const dlRes1 = await request(app).put(`/api/secured-docs/${docId}/download`).send();
    assert.strictEqual(dlRes1.status, 200);
    assert.strictEqual(dlRes1.body.downloadCount, 1);

    const dlRes2 = await request(app).put(`/api/secured-docs/${docId}/download`).send();
    assert.strictEqual(dlRes2.status, 200);
    assert.strictEqual(dlRes2.body.downloadCount, 2);

    console.log('All secured docs tests passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(2);
  }
})();

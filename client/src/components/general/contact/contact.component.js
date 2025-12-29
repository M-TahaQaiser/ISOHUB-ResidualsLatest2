import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Alert, InputLabel } from '@mui/material';

const ContactForm = ({
  fields,
  endpoint,
  successMessage = "Your request has been submitted successfully!",
  errorMessage = "There was an error processing your request. Please try again.",
  buttonLabel = "Submit",
  onSubmitSuccess,
  onSubmitError,
}) => {
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {})
  );

  const [file, setFile] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (e.target.type === 'file') {
      setFile(files[0]);
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (file) data.append('file', file);

    try {
      await axios.post(endpoint, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAlert({ type: 'success', message: successMessage });
      if (onSubmitSuccess) onSubmitSuccess(formData, file);
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: errorMessage });
      if (onSubmitError) onSubmitError(error);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: 'auto',
        p: 4,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 4,
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Contact Form
      </Typography>

      {alert.message && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <Box key={field.name} sx={{ mb: 3 }}>
            {field.type === 'textarea' ? (
              <TextField
                multiline
                rows={4}
                fullWidth
                label={field.label}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.required}
                variant="outlined"
              />
            ) : field.type === 'file' ? (
              <Box>
                <InputLabel htmlFor={field.name}>{field.label}</InputLabel>
                <input
                  type="file"
                  id={field.name}
                  name={field.name}
                  accept={field.accept}
                  onChange={handleChange}
                  style={{
                    marginTop: '8px',
                    display: 'block',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </Box>
            ) : (
              <TextField
                fullWidth
                label={field.label}
                name={field.name}
                type={field.type}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.required}
                variant="outlined"
              />
            )}
          </Box>
        ))}

        <Button
          variant="contained"
          color="primary"
          type="submit"
          fullWidth
          sx={{
            mt: 2,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            boxShadow: 3,
            '&:hover': {
              backgroundColor: 'primary.dark',
              boxShadow: 4,
            },
          }}
        >
          {buttonLabel}
        </Button>
      </form>
    </Box>
  );
};

export default ContactForm;

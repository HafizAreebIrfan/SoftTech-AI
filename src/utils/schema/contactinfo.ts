import * as yup from 'yup';

export const ContactInfoSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter correct email'),
  phone: yup.string().required('Phone is required'),
});

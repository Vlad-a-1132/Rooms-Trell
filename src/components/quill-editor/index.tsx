import React, { useRef, useMemo } from 'react';
//https://github.com/zenoamaro/react-quill/issues/122
const ReactQuill = typeof window === 'object' ? require('react-quill') : () => false;
import 'react-quill/dist/quill.snow.css';
import { Box } from '@chakra-ui/react';

const MAX_IMAGE_SIZE = 800; // Maximum width or height in pixels

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_IMAGE_SIZE) {
            height = Math.round((height * MAX_IMAGE_SIZE) / width);
            width = MAX_IMAGE_SIZE;
          }
        } else {
          if (height > MAX_IMAGE_SIZE) {
            width = Math.round((width * MAX_IMAGE_SIZE) / height);
            height = MAX_IMAGE_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format for better compression
        const compressedImage = canvas.toDataURL('image/webp', 0.7);
        resolve(compressedImage);
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const QuillEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection(true);

          // Show loading state
          editor.insertText(range.index, 'Uploading image...', { color: 'gray' });

          // Compress image
          const compressedImage = await compressImage(file);

          // Remove loading text
          editor.deleteText(range.index, 'Uploading image...'.length);

          // Insert compressed image
          editor.insertEmbed(range.index, 'image', compressedImage);
          editor.setSelection(range.index + 1);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: {
          image: imageHandler
        }
      }
    }),
    []
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image'
  ];

  return (
    <Box className="text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{
          height: '200px',
          marginBottom: '50px'
        }}
      />
    </Box>
  );
};

export default QuillEditor;

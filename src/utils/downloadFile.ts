export const downloadFile = (obj: Blob | MediaSource, fileName: string) => {
  const url = window.URL.createObjectURL(obj);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

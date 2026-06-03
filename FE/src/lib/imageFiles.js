export function readImageFileAsDataUrl(file, maxBytes = 750000) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Chưa chọn ảnh."));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Chỉ chọn file ảnh."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("Ảnh tối đa khoảng 750KB. Hãy chọn ảnh nhẹ hơn."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(file);
  });
}

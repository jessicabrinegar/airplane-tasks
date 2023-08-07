const getFileSize = (fileAsString: string) => {
  return `Output Size: ${(Buffer.byteLength(JSON.stringify(fileAsString)) / 1024 / 1024).toFixed(
    2
  )}mb`
}

export default getFileSize

// export const readFileSystem;

// export const getFileUrl = async (
//   url: URL,
// ): Promise<Partial<BottFile>> => {
//   const response = await fetch(url);

//   const mimetype = response.headers.get("content-type");

//   if (!mimetype || !(mimetype in BottFileMimetypes)) {
//     throw new TypeError(`Invalid mimetype: ${mimetype}`);
//   }

//   const data = await response.arrayBuffer();

//   return {
//     data: new Uint8Array(data),
//     mimetype: mimetype as BottFileMimetypes,
//     name: url.pathname.split("/").pop()!,
//     url,
//   };
// };

export const readFileSystem = async (url: URL) => {
};

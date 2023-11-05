export default class HttpError extends Error {
  code: any;
  constructor(message: string | undefined, errorCode: any) {
    super(message); // Add a 'message' property
    this.code = errorCode; // Adds a 'code' property
  }
}

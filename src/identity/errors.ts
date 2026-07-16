export class InvalidInputError extends Error {
  override name = 'InvalidInputError';
  constructor(input: string, reason: string) {
    super(`not a handle, DID, or at:// URI (${reason}): ${input}`);
  }
}

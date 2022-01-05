export class Completer<T> {
  public readonly promise: Promise<T>;
  public complete: (value: PromiseLike<T> | T) => void;
  public reject: (reason?: any) => void;

  private resolved: boolean;

  public constructor() {
    this.resolved = false;
    this.complete = () => null;
    this.reject = () => null;

    this.promise = new Promise<T>((resolve, reject) => {
      this.complete = (value) => {
        this.resolved = true;
        resolve(value);
      };
      this.reject = reject;
    });
  }

  public get completed(): boolean {
    return this.resolved;
  }
}

export class Completer<T> {
  private isCompleted: boolean = false;
  public readonly promise: Promise<T>;

  public resolve: (value: PromiseLike<T> | T) => void;
  public reject: (reason?: any) => void;

  constructor() {
    this.resolve = () => null;
    this.reject = () => null;

    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = (...args) => {
        this.isCompleted = true;
        return resolve(...args);
      };
      this.reject = reject;
    });
  }

  public get complete(): boolean {
    return this.isCompleted;
  }
}

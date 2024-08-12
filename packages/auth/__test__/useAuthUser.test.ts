import { renderHook, act, cleanup } from "@testing-library/react-hooks";
import { useAuthUser } from "../src/useAuthUser";
import { Auth, User, UserCredential } from "firebase/auth";
import { useSubscription } from "../../utils/src/useSubscription";

jest.mock("../../utils/src/useSubscription", () => ({
  useSubscription: jest.fn(),
}));

describe("useAuthUser", () => {
  let mockAuth: Auth;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth = {
      onAuthStateChanged: jest.fn(),
    } as unknown as Auth;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await cleanup();
  });

  it("should subscribe to auth state changes", async () => {
    const user = { uid: "123" } as User;
    (useSubscription as jest.Mock).mockReturnValue({ data: user });

    const { result, waitFor } = renderHook(() =>
      useAuthUser(["authUser"], mockAuth)
    );

    await waitFor(() => result.current.isSuccess);

    expect(useSubscription).toHaveBeenCalledWith(
      ["authUser"],
      ["useAuthUser"],
      expect.any(Function),
      expect.objectContaining({})
    );

    expect(result.current.data).toBe(user);
  });

  it("should handle null user", async () => {
    (useSubscription as jest.Mock).mockReturnValue({ data: null });

    const { result, waitFor } = renderHook(() =>
      useAuthUser(["authUser"], mockAuth)
    );

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toBeNull();
  });

  it("should handle errors", async () => {
    const error = new Error("Auth error");
    (useSubscription as jest.Mock).mockReturnValue({ error });

    const { result, waitFor } = renderHook(() =>
      useAuthUser(["authUser"], mockAuth)
    );

    await waitFor(() => result.current.isError);

    expect(result.current.error).toBe(error);
  });

  it("should return a User when signed in", async () => {
    const user = { uid: "123" } as User;
    (useSubscription as jest.Mock).mockReturnValue({ data: user });

    const { result, waitFor } = renderHook(() =>
      useAuthUser(["authUser"], mockAuth)
    );

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toBe(user);
  });
});

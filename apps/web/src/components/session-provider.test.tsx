import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionProvider, useSession } from "./session-provider";
import type { SessionUser } from "@/lib/auth/types";

const user: SessionUser = {
  id: "u1",
  email: "a@b.c",
  name: "Ada Lovelace",
  initials: "AL",
  avatarUrl: null,
  plan: "pro",
};

function Probe() {
  const s = useSession();
  return <span>{s ? s.name : "anon"}</span>;
}

describe("SessionProvider / useSession", () => {
  it("provides the user to consumers", () => {
    render(
      <SessionProvider user={user}>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("provides null when no user", () => {
    render(
      <SessionProvider user={null}>
        <Probe />
      </SessionProvider>,
    );
    expect(screen.getByText("anon")).toBeInTheDocument();
  });
});

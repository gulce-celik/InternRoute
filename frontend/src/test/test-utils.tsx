import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";

interface ProviderOptions extends Omit<RenderOptions, "wrapper"> {
  routerProps?: MemoryRouterProps;
}

function AllProviders({
  children,
  routerProps,
}: {
  children: ReactNode;
  routerProps?: MemoryRouterProps;
}) {
  return <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
}

export function renderWithRouter(ui: ReactElement, options: ProviderOptions = {}) {
  const { routerProps, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders routerProps={routerProps}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

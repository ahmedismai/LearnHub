import { NavLink as RouterNavLink } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const NavLink = forwardRef(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={(navLinkProps) => {
          const resolvedClassName =
            typeof className === "function"
              ? className(navLinkProps)
              : className;
          return cn(
            resolvedClassName,
            navLinkProps.isActive && activeClassName,
            navLinkProps.isPending && pendingClassName,
          );
        }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };

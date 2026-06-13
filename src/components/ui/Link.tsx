import React from 'react';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  className?: string;
  children: React.ReactNode;
}

export function Link({ to, className, children, ...props }: LinkProps): React.JSX.Element {
  return (
    <a href={`#${to}`} className={className} {...props}>
      {children}
    </a>
  );
}

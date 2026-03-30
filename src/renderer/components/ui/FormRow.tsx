import React, { PropsWithChildren } from 'react';

export const FormRow = ({ children }: PropsWithChildren<{}>) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">{children}</div>
);

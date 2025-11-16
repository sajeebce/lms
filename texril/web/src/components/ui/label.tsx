"use client";

import * as React from "react";

export function Label(
  props: React.LabelHTMLAttributes<HTMLLabelElement>
): JSX.Element {
  const { className, ...rest } = props;
  return (
    <label
      {...rest}
      className={
        "text-sm font-medium text-slate-700 " + (className ? className : "")
      }
    />
  );
}


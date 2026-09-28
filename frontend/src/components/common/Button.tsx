import type { VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { buttonVariants } from "@/components/common/buttonVariants";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      type={type}
      {...props}
    />
  );
}

import * as React from 'react';
export declare const forwardRef: <T, P = {}>(render: React.ForwardRefRenderFunction<T, P & {
    ref: React.Ref<T>;
}>) => React.ForwardRefExoticComponent<P> | React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<T>>;

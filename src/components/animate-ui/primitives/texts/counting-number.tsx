'use client';

import * as React from 'react';
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type SpringOptions,
} from 'motion/react';

import {
  useIsInView,
  type UseIsInViewOptions,
} from '@/hooks/use-is-in-view';

type CountingNumberProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  number: number;
  fromNumber?: number;
  padStart?: boolean;
  decimalSeparator?: string;
  decimalPlaces?: number;
  locale?: Intl.LocalesArgument;
  transition?: SpringOptions;
  delay?: number;
  initiallyStable?: boolean;
  startEvent?: string;
} & UseIsInViewOptions;

function CountingNumber({
  ref,
  number,
  fromNumber = 0,
  padStart = false,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  decimalSeparator = '.',
  transition = { stiffness: 90, damping: 50 },
  decimalPlaces = 0,
  locale,
  delay = 0,
  initiallyStable = false,
  startEvent,
  ...props
}: CountingNumberProps) {
  const { ref: localRef, isInView } = useIsInView(
    ref as React.Ref<HTMLElement>,
    {
      inView,
      inViewOnce,
      inViewMargin,
    },
  );

  const numberStr = number.toString();
  const decimals =
    typeof decimalPlaces === 'number'
      ? decimalPlaces
      : numberStr.includes('.')
        ? (numberStr.split('.')[1]?.length ?? 0)
        : 0;

  const motionVal = useMotionValue(initiallyStable ? number : fromNumber);
  const springVal = useSpring(motionVal, transition);
  const shouldReduceMotion = useReducedMotion();
  const numberFormatter = React.useMemo(
    () =>
      locale
        ? new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : null,
    [decimals, locale],
  );

  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      timeoutId = setTimeout(() => {
        if (!isInView) return;
        if (shouldReduceMotion) springVal.jump(number);
        else motionVal.set(number);
      }, delay);
    };

    if (!startEvent) start();
    else window.addEventListener(startEvent, start, { once: true });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (startEvent) window.removeEventListener(startEvent, start);
    };
  }, [
    delay,
    isInView,
    motionVal,
    number,
    shouldReduceMotion,
    springVal,
    startEvent,
  ]);

  React.useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      if (localRef.current) {
        let formatted = numberFormatter
          ? numberFormatter.format(latest)
          : decimals > 0
            ? latest.toFixed(decimals)
            : Math.round(latest).toString();

        if (decimals > 0) {
          formatted = formatted.replace('.', decimalSeparator);
        }

        if (padStart) {
          const finalIntLength = Math.floor(Math.abs(number)).toString().length;
          const [intPart, fracPart] = formatted.split(decimalSeparator);
          const paddedInt = intPart?.padStart(finalIntLength, '0') ?? '';
          formatted = fracPart
            ? `${paddedInt}${decimalSeparator}${fracPart}`
            : paddedInt;
        }

        localRef.current.textContent = formatted;
      }
    });
    return () => unsubscribe();
  }, [
    springVal,
    decimals,
    padStart,
    number,
    decimalSeparator,
    localRef,
    numberFormatter,
  ]);

  const finalIntLength = Math.floor(Math.abs(number)).toString().length;

  const formatValue = (val: number) => {
    if (numberFormatter) return numberFormatter.format(val);
    let out = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
    if (decimals > 0) out = out.replace('.', decimalSeparator);
    if (padStart) {
      const [intPart, fracPart] = out.split(decimalSeparator);
      const paddedInt = (intPart ?? '').padStart(finalIntLength, '0');
      out = fracPart ? `${paddedInt}${decimalSeparator}${fracPart}` : paddedInt;
    }
    return out;
  };

  return (
    <span ref={localRef} data-slot="counting-number" {...props}>
      {formatValue(number)}
    </span>
  );
}

export { CountingNumber, type CountingNumberProps };

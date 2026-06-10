import { Fragment } from 'react';
import { Icon } from '../icons/Icon';

type StepperProps = {
  steps: string[];
  current: number;
};

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="steps" aria-label="Wizard progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={label}>
            <li
              className={'step' + (done ? ' done' : '') + (active ? ' active' : '')}
              aria-current={active ? 'step' : undefined}
            >
              <div className="step-num">{done ? <Icon.Check /> : i + 1}</div>
              <div className="step-label">{label}</div>
            </li>
            {i < steps.length - 1 ? (
              <span className={'step-line' + (done ? ' done' : '')} aria-hidden="true" />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

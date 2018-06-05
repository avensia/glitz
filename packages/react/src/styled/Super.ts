import { StyleArray, StyleOrStyleArray } from '@glitz/type';
import * as React from 'react';
import { Consumer, Context } from '../components/context';
import { isElementLikeType, StyledElementLike } from '../styled/apply-class-name';
import { isElementType, StyledElement } from '../styled/predefined';

export type CSSProp = {
  css?: StyleOrStyleArray;
};

export type StyledProps = {
  apply: () => string | undefined;
  compose: (style?: StyleOrStyleArray) => StyleOrStyleArray;
};

export type StyledElementProps = {
  className?: string;
};

export type ExternalProps<TProps> = Pick<TProps, Exclude<keyof TProps, keyof StyledProps>> & CSSProp;

export interface StyledComponent<TProps> extends React.ComponentClass<ExternalProps<TProps> & CSSProp> {
  compose: (style?: StyleArray) => StyledComponent<TProps>;
}

export type InnerRefProp<TInstance> = {
  innerRef?: React.Ref<TInstance>;
};

export type WithInnerRefProp<TProps, TInstance> = TProps & InnerRefProp<TInstance>;

type ApplyFunction = () => string | undefined;

export default class StyledSuper<TProps> extends React.Component<ExternalProps<TProps>> {
  private renderer: (apply: ApplyFunction) => React.ReactElement<any>;
  private createApplier: (context: Context) => ApplyFunction;
  constructor(
    type: StyledElement | StyledElementLike<React.ComponentType<TProps>> | React.ComponentType<TProps>,
    statics: StyleArray,
    props: ExternalProps<TProps>,
  ) {
    super(props);

    let lastContext: Context | undefined;
    let lastApplier: ApplyFunction | undefined;

    this.createApplier = (context: Context): ApplyFunction => {
      if (lastContext === context && lastApplier) {
        return lastApplier;
      }

      let cache: string | null = null;

      lastContext = context;

      return (lastApplier = () => {
        const styles: StyleOrStyleArray = compose();

        if (!styles) {
          return;
        }

        const isPure = styles === statics;

        if (isPure && cache) {
          return cache;
        }

        const classNames = context.glitz.injectStyle(styles);

        cache = isPure ? classNames : null;

        return classNames;
      });
    };

    const compose = (additionals?: StyleOrStyleArray): StyleOrStyleArray => {
      const dynamics: StyleOrStyleArray | undefined = this.props.css;

      if (!dynamics && !additionals) {
        return statics;
      }

      const styles = ([] as StyleArray).concat(additionals || [], statics, dynamics || []);

      return styles;
    };

    this.renderer =
      isElementType(type) || isElementLikeType<TProps>(type)
        ? apply => {
            const className = (this.props as any).className ? (this.props as any).className + ' ' + apply() : apply();
            const passProps = passingProps<TProps & StyledElementProps>({ className }, this.props);
            return React.createElement(type.value, passProps);
          }
        : apply => {
            const passProps = passingProps<TProps & StyledProps>({ apply, compose }, this.props);
            return React.createElement(type, passProps);
          };
  }
  public render() {
    return React.createElement(Consumer, null, (context: Context) => {
      if (process.env.NODE_ENV !== 'production') {
        if (!(context && context.glitz && context.glitz)) {
          throw new Error(
            "The `<GlitzProvider>` doesn't seem to be used correctly because the core instance couldn't be found",
          );
        }
      }

      return this.renderer(this.createApplier(context));
    });
  }
}

export function isStyledComponent<TProps>(type: any): type is StyledComponent<TProps> {
  return typeof type === 'function' && type.prototype instanceof StyledSuper;
}

function passingProps<T>(destination: any, props: any): T {
  for (let name in props) {
    const value = props[name];
    if (name !== 'css') {
      if (name === 'innerRef') {
        name = 'ref';
      }
      // Don't override preexisting props
      destination[name] = destination[name] || value;
    }
  }
  return destination;
}
import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';

interface CustomScrollViewProps extends ScrollViewProps {
  className?: string;
  contentContainerClassName?: string;
}

const ScrollView: React.FC<CustomScrollViewProps> = ({
  className = '',
  contentContainerClassName = '',
  style,
  contentContainerStyle,
  children,
  ...props
}) => {
  return (
    <RNScrollView
      className={className}
      style={style}
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={contentContainerStyle}
      {...props}>
      {children}
    </RNScrollView>
  );
};

export default ScrollView;

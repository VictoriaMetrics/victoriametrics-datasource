import { I18nProvider } from 'app/core/internationalization';
import React from 'react';


const TestProvider: React.FC = ({ children }) => {
  return <I18nProvider>{children}</I18nProvider>;
};

export default TestProvider;

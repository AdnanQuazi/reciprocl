import { RuleTester } from 'eslint';
import rule from './no-hardcoded-colors.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const errors = count => Array.from({ length: count }, () => ({ messageId: 'hardcodedColor' }));
// Tailwind scans test files too. Decode sample classes at runtime so fixtures do not enter production CSS.
const fixture = code => code.replaceAll('§', '-');

tester.run('no-hardcoded-colors', rule, {
  valid: [
    fixture('<div className="bg§background bg§primary text§foreground text§muted§foreground border§border ring§ring bg§success bg§warning bg§info stroke§chart§1" />'),
    fixture('<div className="text§sm border§2 rounded§md bg§transparent text§inherit fill§current" />'),
    fixture('<div className="hover:bg§muted dark:text§muted§foreground sm:border§input text§[length:14px] bg§[url(/image.png)] bg§[var(--surface)]" />'),
    fixture("cn('bg§card', active && 'text§primary§foreground', { 'text§foreground': active })"),
    fixture("cva('bg§primary text§primary§foreground', { variants: { kind: { info: 'bg§info text§info§foreground' } } })"),
    fixture("const label = 'bg§red§500'; const url = 'https://example.com/bg§red§500'; const note = 'text§white is an example';"),
    fixture("const config = { title: 'bg§black', style: { backgroundColor: '#ff0000' } };"),
  ],
  invalid: [
    {
      code: fixture('<div className="bg§blue§600 text§slate§900 border§red§500 bg§blue§600/50" />'),
      errors: errors(4),
    },
    {
      code: fixture('<div className="bg§black text§white bg§black/50" />'),
      errors: errors(3),
    },
    {
      code: fixture('<div className="bg§[#121212] text§[rgb(1,2,3)] text§[rgb(1 2 3)] border§[hsl(0_0%_0%)]" />'),
      errors: errors(4),
    },
    {
      code: fixture('<div className="hover:bg§blue§600 focus:text§white dark:border§red§500 md:ring§slate§900 group-hover/foo:bg§black" />'),
      errors: errors(5),
    },
    {
      code: fixture('<div className="[&>span]:text§[#fff] !bg§black/50 dark:!text§white" />'),
      errors: errors(3),
    },
    {
      code: fixture('<div className={`bg§red§500 ${active ? "text§blue§600" : "text§foreground"}`} />'),
      errors: errors(2),
    },
    {
      code: fixture("cn('text§rose§500', { 'dark:bg§gray§950': active })"),
      errors: errors(2),
    },
    {
      code: fixture("cva('border§amber§500', { variants: { state: { active: 'focus:bg§black' } } })"),
      errors: errors(2),
    },
    {
      code: fixture("const config = { className: 'bg§red§500' };"),
      errors: errors(1),
    },
    {
      code: fixture("const buttonClasses = 'hover:bg§blue§600';"),
      errors: errors(1),
    },
  ],
});

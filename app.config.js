const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.samuenella.flash.dev';
  }

  if (IS_PREVIEW) {
    return 'com.samuenella.flash.preview';
  }

  return 'com.samuenella.flash';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Flash (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Flash (Preview)';
  }

  return 'Flash';
};


export default ({ config }) => ({
  ...config,
  name: getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});


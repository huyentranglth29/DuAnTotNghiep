import {useEffect, useState} from 'react';

const asArray = response => Array.isArray(response) ? response : response?.data || [];

function useAdminOptions(loaders = {}) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    let active = true;

    Promise.all(
      Object.entries(loaders).map(async ([key, loader]) => {
        const items = asArray(await loader.api.getAll({limit: 200}));
        return [
          key,
          items.map(item => ({
            value: item._id || item.id,
            label: loader.label(item),
          })),
        ];
      }),
    )
      .then(entries => {
        if (active) {
          setOptions(Object.fromEntries(entries));
        }
      })
      .catch(() => {
        if (active) {
          setOptions({});
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return options;
}

export default useAdminOptions;

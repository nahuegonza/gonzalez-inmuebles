(function () {
  const DEFAULT_PROPERTY_TYPES = [
    { value: 'Casa', label: 'Casa' },
    { value: 'Departamento', label: 'Departamento' },
    { value: 'PH', label: 'PH' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Comercial', label: 'Local / Galpón / Depósito' },
    { value: 'Emprendimiento', label: 'Emprendimiento' },
    { value: 'Cochera', label: 'Cochera' }
  ];

  const typeAliases = new Map([
    ['casa', 'Casa'],
    ['departamento', 'Departamento'],
    ['depto', 'Departamento'],
    ['ph', 'PH'],
    ['p h', 'PH'],
    ['terreno', 'Terreno'],
    ['terrenos', 'Terreno'],
    ['lote', 'Terreno'],
    ['lotes', 'Terreno'],
    ['terreno o lote', 'Terreno'],
    ['terrenos y lotes', 'Terreno'],
    ['comercial', 'Comercial'],
    ['local', 'Comercial'],
    ['galpon', 'Comercial'],
    ['galpon deposito', 'Comercial'],
    ['local galpon', 'Comercial'],
    ['local galpon deposito', 'Comercial'],
    ['emprendimiento', 'Emprendimiento'],
    ['emprendimientos', 'Emprendimiento'],
    ['cochera', 'Cochera'],
    ['cocheras', 'Cochera']
  ]);

  const normalizeKey = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const normalizePropertyType = (value) => {
    const key = normalizeKey(value);
    if (!key) return '';
    return typeAliases.get(key) || String(value || '').trim();
  };

  const canonicalByValue = new Map(DEFAULT_PROPERTY_TYPES.map(type => [type.value, type]));

  const getPropertyTypes = (includeInactive = false) => {
    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem('property_types_db') || 'null');
    } catch {
      stored = null;
    }

    const source = Array.isArray(stored) && stored.length
      ? stored.map(type => {
        const value = normalizePropertyType(type.nombre || type.value || type.label);
        const canonical = canonicalByValue.get(value);
        return {
          id: type.id,
          value: canonical?.value || value,
          label: canonical?.label || value,
          activo: type.activo !== false
        };
      })
      : DEFAULT_PROPERTY_TYPES.map((type, index) => ({ ...type, id: index + 1, activo: true }));

    const unique = [];
    const seen = new Set();
    source.forEach(type => {
      if (!type.value || seen.has(type.value)) return;
      seen.add(type.value);
      if (includeInactive || type.activo) unique.push(type);
    });

    return unique;
  };

  const renderPropertyTypeSelect = (select, options = {}) => {
    if (!select) return;

    const current = normalizePropertyType(select.value || select.dataset.selectedValue);
    const includeEmpty = options.includeEmpty ?? select.dataset.propertyTypeEmpty === 'true';
    const placeholder = options.placeholder || select.dataset.propertyTypePlaceholder || 'Tipo de Inmueble';
    const types = getPropertyTypes(false);

    select.innerHTML = [
      includeEmpty ? `<option value="">${placeholder}</option>` : '',
      ...types.map(type => `<option value="${type.value}">${type.label}</option>`)
    ].join('');

    if (current && types.some(type => type.value === current)) {
      select.value = current;
    }
  };

  const renderPropertyTypeSelects = () => {
    renderPropertyTypeSelect(document.getElementById('searchType'), {
      includeEmpty: true,
      placeholder: 'Tipo de Inmueble'
    });
    renderPropertyTypeSelect(document.getElementById('filterType'), {
      includeEmpty: true,
      placeholder: 'Todos'
    });
    renderPropertyTypeSelect(document.getElementById('tasTipo'), {
      includeEmpty: true,
      placeholder: 'Tipo de Inmueble...'
    });

    document.querySelectorAll('.type-selector, #ty, #m_ty').forEach(select => {
      renderPropertyTypeSelect(select, { includeEmpty: false });
    });
  };

  window.PROPERTY_TYPES = DEFAULT_PROPERTY_TYPES;
  window.getPropertyTypes = getPropertyTypes;
  window.normalizePropertyType = normalizePropertyType;
  window.renderPropertyTypeSelect = renderPropertyTypeSelect;
  window.renderPropertyTypeSelects = renderPropertyTypeSelects;

  document.addEventListener('DOMContentLoaded', renderPropertyTypeSelects);
})();

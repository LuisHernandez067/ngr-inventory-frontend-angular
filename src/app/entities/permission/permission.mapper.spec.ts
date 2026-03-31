import { PermissionMapper } from './permission.mapper';
import type { PermissionDto } from './permission.types';

const baseDto: PermissionDto = {
  key: 'inventory.products.read',
  label: 'Ver productos',
  module: 'inventory',
  group: 'products',
  description: 'Permite ver el listado de productos',
};

describe('PermissionMapper', () => {
  describe('fromDto', () => {
    it('maps base fields correctly', () => {
      const result = PermissionMapper.fromDto(baseDto);
      expect(result.key).toBe('inventory.products.read');
      expect(result.label).toBe('Ver productos');
      expect(result.module).toBe('inventory');
      expect(result.group).toBe('products');
    });

    it('moduleLabel capitalizes first letter of module', () => {
      const result = PermissionMapper.fromDto(baseDto);
      expect(result.moduleLabel).toBe('Inventory');
    });

    it('moduleLabel capitalizes single-word module', () => {
      const result = PermissionMapper.fromDto({ ...baseDto, module: 'catalog' });
      expect(result.moduleLabel).toBe('Catalog');
    });

    it('fullLabel format is "ModuleLabel › label"', () => {
      const result = PermissionMapper.fromDto(baseDto);
      expect(result.fullLabel).toBe('Inventory › Ver productos');
    });

    it('description is empty string when not provided', () => {
      const result = PermissionMapper.fromDto({ ...baseDto, description: undefined });
      expect(result.description).toBe('');
    });

    it('description is set when provided', () => {
      const result = PermissionMapper.fromDto(baseDto);
      expect(result.description).toBe('Permite ver el listado de productos');
    });
  });

  describe('groupPermissions', () => {
    const permissions = [
      PermissionMapper.fromDto({ key: 'inventory.products.read',  label: 'Ver productos',   module: 'inventory', group: 'products' }),
      PermissionMapper.fromDto({ key: 'inventory.products.write', label: 'Crear productos',  module: 'inventory', group: 'products' }),
      PermissionMapper.fromDto({ key: 'inventory.warehouse.read', label: 'Ver almacenes',   module: 'inventory', group: 'warehouse' }),
      PermissionMapper.fromDto({ key: 'catalog.categories.read',  label: 'Ver categorías',  module: 'catalog',   group: 'categories' }),
    ];

    it('groups permissions correctly by module', () => {
      const result = PermissionMapper.groupPermissions(permissions);
      expect(result).toHaveLength(2);
      const modules = result.map(r => r.module);
      expect(modules).toContain('inventory');
      expect(modules).toContain('catalog');
    });

    it('groups permissions correctly by group within module', () => {
      const result = PermissionMapper.groupPermissions(permissions);
      const inventory = result.find(r => r.module === 'inventory')!;
      expect(inventory.groups).toHaveLength(2);
      const groupNames = inventory.groups.map(g => g.group);
      expect(groupNames).toContain('products');
      expect(groupNames).toContain('warehouse');
    });

    it('handles single module correctly', () => {
      const singleModulePerms = permissions.filter(p => p.module === 'inventory');
      const result = PermissionMapper.groupPermissions(singleModulePerms);
      expect(result).toHaveLength(1);
      expect(result[0].module).toBe('inventory');
    });

    it('products group has 2 permissions', () => {
      const result = PermissionMapper.groupPermissions(permissions);
      const inventory = result.find(r => r.module === 'inventory')!;
      const products = inventory.groups.find(g => g.group === 'products')!;
      expect(products.permissions).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      const result = PermissionMapper.groupPermissions([]);
      expect(result).toEqual([]);
    });

    it('moduleLabel is set correctly on groups', () => {
      const result = PermissionMapper.groupPermissions(permissions);
      const catalog = result.find(r => r.module === 'catalog')!;
      expect(catalog.moduleLabel).toBe('Catalog');
    });
  });
});

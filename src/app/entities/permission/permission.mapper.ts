import type { PermissionDto, Permission, PermissionGroup } from './permission.types';

export class PermissionMapper {
  static fromDto(dto: PermissionDto): Permission {
    const moduleLabel = dto.module.charAt(0).toUpperCase() + dto.module.slice(1);
    return {
      key:         dto.key,
      label:       dto.label,
      module:      dto.module,
      group:       dto.group,
      description: dto.description ?? '',
      moduleLabel,
      fullLabel:   `${moduleLabel} › ${dto.label}`,
    };
  }

  static groupPermissions(permissions: Permission[]): PermissionGroup[] {
    const moduleMap = new Map<string, Map<string, Permission[]>>();

    for (const perm of permissions) {
      if (!moduleMap.has(perm.module)) {
        moduleMap.set(perm.module, new Map());
      }
      const groupMap = moduleMap.get(perm.module)!;
      if (!groupMap.has(perm.group)) {
        groupMap.set(perm.group, []);
      }
      groupMap.get(perm.group)!.push(perm);
    }

    const result: PermissionGroup[] = [];
    for (const [module, groupMap] of moduleMap) {
      const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
      const groups: PermissionGroup['groups'] = [];
      for (const [group, perms] of groupMap) {
        groups.push({ group, permissions: perms });
      }
      result.push({ module, moduleLabel, groups });
    }

    return result;
  }
}

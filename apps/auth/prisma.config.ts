import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: 'mysql://root:root@localhost:3306/space_defenders',
  },
});
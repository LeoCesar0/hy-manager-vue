<script setup lang="ts">
import type { IOrganization } from "@common/schemas/organization/organization";
import type { IPaginationBody } from "@common/schemas/pagination";
import { NULLISH_FILTER } from "@common/static/filters";
import { API_ROUTE } from "@common/static/routes";
import type { ISelectOption } from "~/@schemas/select";

type Props = {
  name: string;
  label: string;
};

const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);

const dashboardStore = useDashboardStore();
const { currentOrganization, currentTeam } = storeToRefs(dashboardStore);

const props = defineProps<Props>();

const paginationRef = ref<IPaginationBody<IOrganization>>({
  limit: 9999,
  filters: {
    ...(currentOrganization.value?.masterOrganization
      ? {}
      : { masterOrganization: NULLISH_FILTER }),
  },
});

const { data: orgRes, execute: getOrganizations } =
  usePaginateApi<IOrganization>({
    url: API_ROUTE.organizations.paginate.url,
    bodyRef: paginationRef,
    immediate: false,
  });
getOrganizations();

const organizationOptions = computed<ISelectOption[]>(() => {
  const orgs = orgRes.value?.data?.list ?? [];
  return orgs.map((item) => {
    return {
      label: item.name,
      value: item._id,
    };
  });
});
</script>

<template>
  <FormField
    :name="name"
    :label="label"
    inputVariant="select"
    :selectOptions="organizationOptions"
    :required="true"
  />
</template>

<style lang="scss" scoped></style>

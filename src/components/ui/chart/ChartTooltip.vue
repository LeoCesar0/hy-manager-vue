<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { beautifyObjectName } from "@/helpers/shadcnui-utils/auto-form";
import { type IChartTooltip } from "./interface";

const props = defineProps<IChartTooltip>();

const getKeyLabel = (key: string) => {
  if (props.keyLabels) {
    return props.keyLabels[key] || "";
  }

  return key.split(":")[0]
    ? `${beautifyObjectName(key.split(":")[0] || "")}:`
    : "";
};
const getValue = (value: string) => {
  if (props.keyLabels) {
    return value;
  }
  return value.split(":").slice(1).join("") ?? value;
};
</script>

<template>
  <Card class="text-sm">
    <CardHeader v-if="title" class="p-3 border-b">
      <CardTitle>
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent class="p-3 min-w-[250px] max-w-[630px] flex flex-col gap-1">
      <div
        v-for="(item, key) in data"
        :key="key"
        class="flex justify-start items-center"
      >
        <div class="flex items-center">
          <span class="w-2.5 h-2.5 mr-2">
            <svg width="100%" height="100%" viewBox="0 0 30 30">
              <path
                d=" M 15 15 m -14, 0 a 14,14 0 1,1 28,0 a 14,14 0 1,1 -28,0"
                :stroke="item.color || 'transparent'"
                :fill="item.color || 'transparent'"
                stroke-width="1"
              />
            </svg>
          </span>
        </div>
        <p class="font-semibold ml-2" v-if="item.name">
          {{ beautifyObjectName(item.name || "") }}
          {{ " "
          }}<span class="font-regular text-muted-foreground">{{
            item.value
          }}</span>
        </p>
        <p class="ml-2" v-if="!item.name && typeof item.value === 'string'">
          <span class="font-semibold" v-if="item.key">
            {{ getKeyLabel(item.key) }}
          </span>
          {{ " "
          }}<span class="font-regular text-muted-foreground">{{
            getValue(item.value)
          }}</span>
        </p>
      </div>
    </CardContent>
  </Card>
</template>

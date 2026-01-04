<script setup lang="ts">
import { useField, type ComponentFieldBindingObject } from "vee-validate";
import { XIcon, UploadIcon, FileIcon } from "lucide-vue-next";
import { cn } from "~/lib/utils";
import type { IFile } from "~/@schemas/models/file";
import type { Nullish } from "~/@types/helpers";

export type IFileUploaderProps = {
  showPreview?: boolean;
  acceptedFileTypes?: string[];
  onFilesUploaded?: (files: IFile[]) => void;
  onFilesSelected?: (files: File[]) => void;
  uploadToOpenAI?: boolean;
};

type IProps = {
  name: string;
  disabled?: boolean;
  class?: string;
} & IFileUploaderProps;

const props = withDefaults(defineProps<IProps>(), {
  showPreview: true,
  multiple: true,
  acceptedFileTypes: () => ["*"],
});

const { value, meta, errorMessage, handleChange } = useField<Nullish<string[]>>(
  props.name
);
const fileInputRef = ref<HTMLInputElement | null>(null);

const { uploadFiles, listFiles } = useFile();

const isLoadingFiles = ref(false);
const uploadedFiles = ref<IFile[]>([]);
const selectedFiles = ref<File[]>([]);

const checkedInitialValue = ref(false);

const formIsLoading = inject<Ref<boolean> | undefined>("formIsLoading");

watch(isLoadingFiles, (isUploading) => {
  if (formIsLoading) {
    formIsLoading.value = isUploading;
  }
});

watch(
  value,
  () => {
    if (!checkedInitialValue.value) {
      checkedInitialValue.value = true;
    } else {
      return;
    }

    if (value.value && value.value.length > 0) {
      isLoadingFiles.value = true;
      listFiles(value.value)
        .then((res) => {
          uploadedFiles.value = res.data ?? [];
        })
        .finally(() => {
          isLoadingFiles.value = false;
        });
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

// Initialize with empty array if value is null/undefined to avoid validation errors
onMounted(() => {
  if (!value.value) {
    handleChange([]);
  }
});

const handleFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  // Convert FileList to array
  const files: File[] = Array.from(input.files);
  selectedFiles.value = files;

  if (props.onFilesSelected) {
    props.onFilesSelected(files);
  }

  // Automatically upload files
  uploadSelectedFiles();
};

const uploadSelectedFiles = async () => {
  if (!selectedFiles.value.length) return;

  try {
    isLoadingFiles.value = true;

    const response = await uploadFiles(selectedFiles.value);

    if (response.data && !response.error) {
      if (props.onFilesUploaded) {
        props.onFilesUploaded(response.data);
      }

      // Add new files to our tracked uploaded files
      uploadedFiles.value = [...uploadedFiles.value, ...response.data];

      // Update the form field value with file IDs
      const fileIds = uploadedFiles.value.map((file) => file.id);

      handleChange(fileIds);
    }
  } catch (error) {
    console.error("Error uploading files:", error);
  } finally {
    isLoadingFiles.value = false;
    // Clear selected files
    selectedFiles.value = [];
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  }
};

const openFileSelector = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const removeFile = (index: number) => {
  const updatedFiles = [...uploadedFiles.value];
  updatedFiles.splice(index, 1);
  uploadedFiles.value = updatedFiles;

  // Update the form field value with remaining file IDs
  const fileIds = uploadedFiles.value.map((file) => file.id);

  // Ensure fileIds is empty array instead of undefined or null if no files
  handleChange(fileIds.length > 0 ? fileIds : []);
};
const acceptedFileTypesAsString = computed(() => {
  return props.acceptedFileTypes?.join(",");
});
</script>

<template>
  <div :class="cn('w-full space-y-2', props.class)">
    <div
      :class="
        cn(
          'border border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer',
          {
            'bg-muted/10 hover:bg-muted/20': !disabled,
            'opacity-50 cursor-not-allowed': disabled,
            'border-destructive': !!errorMessage,
            'border-input': !errorMessage,
          }
        )
      "
      @click="openFileSelector"
    >
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        :multiple="true"
        :accept="acceptedFileTypesAsString"
        @change="handleFileSelection"
      />

      <UploadIcon class="h-6 w-6 text-muted-foreground" />
      <div class="text-center">
        <p class="text-sm font-medium">Click to upload files</p>
        <p class="text-xs text-muted-foreground">
          or drag and drop
          <span v-if="acceptedFileTypesAsString">
            ({{ acceptedFileTypesAsString.replace(/\./g, "") }})
          </span>
        </p>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoadingFiles" class="flex items-center justify-center py-2">
      <Loading :isLoading="isLoadingFiles" size="sm" />
      <span class="ml-2 text-sm text-muted-foreground">Uploading...</span>
    </div>

    <!-- File previews -->
    <div v-if="uploadedFiles.length && showPreview" class="space-y-2 mt-2">
      <div
        v-for="(file, index) in uploadedFiles"
        :key="file.id"
        class="flex items-center justify-between p-2 rounded-md bg-muted/10"
      >
        <div class="flex items-center">
          <FileIcon class="h-4 w-4 mr-2 text-muted-foreground" />
          <div>
            <p class="text-sm font-medium truncate max-w-[200px]">
              {{ file.name }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ file.size ? Math.round(file.size / 1024) : 0 }} KB
            </p>
          </div>
        </div>
        <UiButton
          variant="ghost"
          size="icon"
          @click.stop="removeFile(index)"
          :disabled="disabled"
        >
          <XIcon class="h-4 w-4 text-muted-foreground" />
        </UiButton>
      </div>
    </div>
  </div>
</template>

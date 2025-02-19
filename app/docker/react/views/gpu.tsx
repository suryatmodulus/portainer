import { useMemo } from 'react';
import { components } from 'react-select';
import { OnChangeValue } from 'react-select/dist/declarations/src/types';
import { OptionProps } from 'react-select/dist/declarations/src/components/Option';

import { Select } from '@@/form-components/ReactSelect';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { Tooltip } from '@@/Tip/Tooltip';

interface Values {
  enabled: boolean;
  selectedGPUs: string[];
  capabilities: string[];
}

interface GpuOption {
  value: string;
  label: string;
  description?: string;
}

export interface GPU {
  value: string;
  name: string;
}

export interface Props {
  values: Values;
  onChange(values: Values): void;
  gpus: GPU[];
  usedGpus: string[];
  usedAllGpus: boolean;
}

const NvidiaCapabilitiesOptions = [
  // Taken from https://github.com/containerd/containerd/blob/master/contrib/nvidia/nvidia.go#L40
  {
    value: 'compute',
    label: 'compute',
    description: 'required for CUDA and OpenCL applications',
  },
  {
    value: 'compat32',
    label: 'compat32',
    description: 'required for running 32-bit applications',
  },
  {
    value: 'graphics',
    label: 'graphics',
    description: 'required for running OpenGL and Vulkan applications',
  },
  {
    value: 'utility',
    label: 'utility',
    description: 'required for using nvidia-smi and NVML',
  },
  {
    value: 'video',
    label: 'video',
    description: 'required for using the Video Codec SDK',
  },
  {
    value: 'display',
    label: 'display',
    description: 'required for leveraging X11 display',
  },
];

function Option(props: OptionProps<GpuOption, true>) {
  const {
    data: { value, description },
  } = props;

  return (
    <div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <components.Option {...props}>
        {`${value} - ${description}`}
      </components.Option>
    </div>
  );
}

export function Gpu({
  values,
  onChange,
  gpus = [],
  usedGpus = [],
  usedAllGpus,
}: Props) {
  const options = useMemo(() => {
    const options = (gpus || []).map((gpu) => ({
      value: gpu.value,
      label:
        usedGpus.includes(gpu.value) || usedAllGpus
          ? `${gpu.name} (in use)`
          : gpu.name,
    }));

    return options;
  }, [gpus, usedGpus, usedAllGpus]);

  function onChangeValues(key: string, newValue: boolean | string[]) {
    const newValues = {
      ...values,
      [key]: newValue,
    };
    onChange(newValues);
  }

  function toggleEnableGpu() {
    onChangeValues('enabled', !values.enabled);
  }

  function onChangeSelectedGpus(newValue: OnChangeValue<GpuOption, true>) {
    onChangeValues(
      'selectedGPUs',
      newValue.map((option) => option.value)
    );
  }

  function onChangeSelectedCaps(newValue: OnChangeValue<GpuOption, true>) {
    onChangeValues(
      'capabilities',
      newValue.map((option) => option.value)
    );
  }

  const gpuCmd = useMemo(() => {
    const devices = values.selectedGPUs.join(',');
    const caps = values.capabilities.join(',');
    return `--gpus 'device=${devices},"capabilities=${caps}"`;
  }, [values.selectedGPUs, values.capabilities]);

  const gpuValue = useMemo(
    () =>
      options.filter((option) => values.selectedGPUs.includes(option.value)),
    [values.selectedGPUs, options]
  );

  const capValue = useMemo(
    () =>
      NvidiaCapabilitiesOptions.filter((option) =>
        values.capabilities.includes(option.value)
      ),
    [values.capabilities]
  );

  return (
    <div>
      <div className="form-group">
        <div className="col-sm-3 col-lg-2 control-label text-left">
          Enable GPU
          <Switch
            id="enabled"
            name="enabled"
            checked={values.enabled}
            onChange={toggleEnableGpu}
            className="ml-2"
          />
        </div>
        <div className="col-sm-9 col-lg-10 text-left">
          <Select<GpuOption, true>
            isMulti
            closeMenuOnSelect
            value={gpuValue}
            isDisabled={!values.enabled}
            onChange={onChangeSelectedGpus}
            options={options}
          />
        </div>
      </div>

      {values.enabled && (
        <>
          <div className="form-group">
            <div className="col-sm-3 col-lg-2 control-label text-left">
              Capabilities
              <Tooltip
                message={
                  "This is the generated equivalent of the '--gpus' docker CLI parameter based on your settings."
                }
              />
            </div>
            <div className="col-sm-9 col-lg-10 text-left">
              <Select<GpuOption, true>
                isMulti
                closeMenuOnSelect
                value={capValue}
                options={NvidiaCapabilitiesOptions}
                components={{ Option }}
                onChange={onChangeSelectedCaps}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="col-sm-3 col-lg-2 control-label text-left">
              Control
              <Tooltip message="This is the generated equivalent of the '--gpus' docker CLI parameter based on your settings." />
            </div>
            <div className="col-sm-9 col-lg-10">
              <code>{gpuCmd}</code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

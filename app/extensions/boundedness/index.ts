import type { PetriNetExtension } from '~/types/extension';
import IconInfinity from '~icons/tabler/infinity';
import Boundedness from '~/extensions/boundedness/Boundedness.vue';

const extension: PetriNetExtension = {
  id: 'built-in/boundedness',
  name: 'Boundedness Check',
  icon: IconInfinity,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(Boundedness, { petriNet: context.net });
      },
    });
  },
};

export default extension;

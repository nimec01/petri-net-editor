import type { PetriNetExtension } from '~/types/extension';
import IconShieldCheck from '~icons/tabler/shield-check';
import Safeness from '~/extensions/safeness/Safeness.vue';

const extension: PetriNetExtension = {
  id: 'built-in/safeness',
  name: 'Safeness Check',
  icon: IconShieldCheck,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(Safeness, { petriNet: context.net });
      },
    });
  },
};

export default extension;

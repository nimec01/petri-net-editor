import type { PetriNetExtension } from '~/types/extension';
import IconTarget from '~icons/tabler/target';
import Reachability from '~/extensions/reachability/Reachability.vue';

const extension: PetriNetExtension = {
  id: 'built-in/reachability',
  name: 'Reachability Check',
  icon: IconTarget,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(Reachability, { petriNet: context.net });
      },
    });
  },
};

export default extension;

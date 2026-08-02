import type { PetriNetExtension } from '~/types/extension';
import IconLock from '~icons/tabler/lock';
import Deadlock from '~/extensions/deadlock/Deadlock.vue';

const extension: PetriNetExtension = {
  id: 'built-in/deadlock',
  name: 'Deadlock Check',
  icon: IconLock,
  run: (context) => {
    return defineComponent({
      setup() {
        return () => h(Deadlock, { petriNet: context.net });
      },
    });
  },
};

export default extension;

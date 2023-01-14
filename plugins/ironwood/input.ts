import State from '~/plugins/ironwood/state';

export default class Input {
  state: State;

  constructor (state: State) {
    this.state = state;
  }

  initialize (container: HTMLElement) {
    container.addEventListener('pointerdown', ((event) => this.onPointerDown(event)), false);
    container.addEventListener('pointerup', ((event) => this.onPointerUp(event)), false);

    container.addEventListener('pointermove', ((event) => this.onPointerMove(event)), false);
    container.addEventListener('pointerout', ((event) => this.onPointerCancel(event)), false);
    container.addEventListener('pointercancel', ((event) => this.onPointerCancel(event)), false);

    container.addEventListener('contextmenu', ((event) => this.onRightClick(event)), false);
    document.addEventListener('contextmenu', ((event) => this.onRightClick(event)), false);

    container.addEventListener('mousewheel', ((event: Event) => this.onScroll(<WheelEvent>event)), false);
  }

  onScroll (event: WheelEvent) {
    if (event.deltaY > 0) {
      this.state.decreaseScale();
    }
    else if (event.deltaY < 0) {
      this.state.increaseScale();
    }
  }

  onRightClick (event: Event) {
    if (process?.env?.NODE_ENV === 'production') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    // event.preventDefault();
    // event.stopPropagation();
    // return false;
    return true;
  }

  onPointerDown (event: PointerEvent) {
    this.state.input.primaryDown = true;
    this.state.input.startX = this.state.input.lastX = Math.round(event.offsetX);
    this.state.input.startY = this.state.input.lastY = Math.round(event.offsetY);
    return true;
  }

  onPointerUp (event: PointerEvent) {
    if (this.state.input.primaryDown) {
      this.state.input.primaryDown = false;
      this.state.input.lastX = Math.round(event.offsetX);
      this.state.input.lastY = Math.round(event.offsetY);

      if (!event.defaultPrevented && this.state.input.lastX == this.state.input.startX && this.state.input.lastY == this.state.input.startY) {
        const isRightClick = event.which == 3 || event.button == 2;

        // TODO: action is click
      }
    }

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onPointerCancel (event: PointerEvent) {
    this.state.input.primaryDown = false;
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onPointerMove (event: PointerEvent) {
    if (this.state.input.primaryDown) {
      const eventX = Math.round(event.offsetX);
      const eventY = Math.round(event.offsetY);
      const deltaX = this.state.input.lastX < 0 ? 0 : this.state.input.lastX - eventX;
      const deltaY = this.state.input.lastY < 0 ? 0 : this.state.input.lastY - eventY;
      this.state.input.lastX = eventX;
      this.state.input.lastY = eventY;
      this.state.panViewTarget(deltaX, deltaY);
    }
  }

}

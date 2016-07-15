import _ from "lodash";

import {
  default as invariant,
} from "invariant";

import {
  Children,
} from "react";

import {
  render,
  unmountComponentAtNode,
} from "react-dom";

export function createContainerElement() {
  const containerElement = document.createElement(`div`);
  containerElement.style.position = `absolute`;
  return containerElement;
}

export function mountContainerElementToPane(mapPanes, containerElement, props) {
  const {
    mapPaneName,
  } = props;
  invariant(!!mapPaneName,
`OverlayView requires either props.mapPaneName or props.defaultMapPaneName but got %s`,
    mapPaneName
  );
  // https://developers.google.com/maps/documentation/javascript/3.exp/reference#MapPanes
  mapPanes[mapPaneName].appendChild(containerElement);
}

function getOffsetOverride(containerElement, props) {
  const {
    getPixelPositionOffset,
  } = props;
  //
  // Allows the component to control the visual position of the OverlayView
  // relative to the LatLng pixel position.
  //
  if (_.isFunction(getPixelPositionOffset)) {
    return getPixelPositionOffset(
      containerElement.offsetWidth,
      containerElement.offsetHeight,
    );
  } else {
    return {};
  }
}

function getLayoutStylesByBounds(mapCanvasProjection, offset, bounds) {
  const ne = mapCanvasProjection.fromLatLngToDivPixel(
    bounds.getNorthEast ?
    bounds.getNorthEast() :
    new google.maps.LatLng(bounds.ne.lat, bounds.ne.lng)
  );
  const sw = mapCanvasProjection.fromLatLngToDivPixel(
    bounds.getSouthWest ?
    bounds.getSouthWest() :
    new google.maps.LatLng(bounds.sw.lat, bounds.sw.lng)
  );
  return {
    left: sw.x + offset.x,
    top: ne.y + offset.y,
    width: ne.x - sw.x - offset.x,
    height: sw.y - ne.y - offset.y,
  };
}

function getLayoutStylesByPosition(mapCanvasProjection, offset, position) {
  const {
    x,
    y,
  } = mapCanvasProjection.fromLatLngToDivPixel(position);
  return {
    left: x + offset.x,
    top: y + offset.y,
    width: `inherit`,
    height: `inherit`,
  };
}

function getLayoutStyles(mapCanvasProjection, offset, props) {
  if (props.bounds) {
    return getLayoutStylesByBounds(mapCanvasProjection, offset, props.bounds);
  } else {
    return getLayoutStylesByPosition(mapCanvasProjection, offset, props.position);
  }
}

export function renderChildToContainerElement(mapCanvasProjection, containerElement, props) {
  const child = Children.only(props.children);
  render(child, containerElement, () => {
    const offset = {
      x: 0,
      y: 0,
      ...getOffsetOverride(containerElement, props),
    };
    const layoutStyles = getLayoutStyles(mapCanvasProjection, offset, props);
    _.assign(containerElement.style, layoutStyles);
  });
}

export function unmountAndDestroyContainerElement(containerElement) {
  containerElement.parentNode.removeChild(containerElement);
  unmountComponentAtNode(containerElement);
}

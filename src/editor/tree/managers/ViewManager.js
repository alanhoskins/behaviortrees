b3e.tree.ViewManager = function(editor, project, tree) {
  "use strict";

  function getFitZoom(bounds, view) {
    var min     = editor._settings.get('zoom_min');
    var max     = editor._settings.get('zoom_max');
    var step    = editor._settings.get('zoom_step');
    var initial = editor._settings.get('zoom_initial');

    var scaleX = bounds.width > 0 ? view.width/bounds.width : initial;
    var scaleY = bounds.height > 0 ? view.height/bounds.height : initial;
    var scale = Math.min(scaleX, scaleY, initial);

    // snap down to a zoom_step multiple so zoomIn/zoomOut stay on round values
    scale = Math.floor(scale/step + 1e-6)*step;

    return tine.clip(scale, min, max);
  }

  this.reset = function() {
    tree.x = 0;
    tree.y = 0;
    tree.scaleX = 1;
    tree.scaleY = 1;
  };
  this.zoom = function(factor) {
    tree.scaleX = factor;
    tree.scaleY = factor;
  };
  this.zoomIn = function() {
    var min = editor._settings.get('zoom_min');
    var max = editor._settings.get('zoom_max');
    var step = editor._settings.get('zoom_step');
    
    var zoom = tree.scaleX;
    this.zoom(tine.clip(zoom+step, min, max));
  };
  this.zoomOut = function() {
    var min = editor._settings.get('zoom_min');
    var max = editor._settings.get('zoom_max');
    var step = editor._settings.get('zoom_step');
    
    var zoom = tree.scaleX;
    this.zoom(tine.clip(zoom-step, min, max));
  };
  this.pan = function(dx, dy) {
    tree.x += dx;
    tree.y += dy;
  };
  this.setCam = function(x, y) {
    tree.x = x;
    tree.y = y;
  };
  this.center = function() {
    var canvas = editor._game.canvas;
    var hw = canvas.width/2;
    var hh = canvas.height/2;
    this.setCam(hw, hh);
  };
  this.getContentBounds = function() {
    var blocks = tree.blocks.getAll();
    if (blocks.length === 0) return null;

    var minX = Infinity, minY = Infinity;
    var maxX = -Infinity, maxY = -Infinity;

    for (var i=0; i<blocks.length; i++) {
      var block = blocks[i];
      var hw = (block._width||0)/2;
      var hh = (block._height||0)/2;

      if (block.x-hw < minX) minX = block.x-hw;
      if (block.y-hh < minY) minY = block.y-hh;
      if (block.x+hw > maxX) maxX = block.x+hw;
      if (block.y+hh > maxY) maxY = block.y+hh;
    }

    return {x:minX, y:minY, width:maxX-minX, height:maxY-minY};
  };
  this.getViewport = function() {
    var canvas = editor._game.canvas;
    var padding = editor._settings.get('viewport_padding')||0;

    var x = (editor._settings.get('viewport_inset_left')||0)+padding;
    var y = (editor._settings.get('viewport_inset_top')||0)+padding;
    var w = canvas.width-x-(editor._settings.get('viewport_inset_right')||0)-padding;
    var h = canvas.height-y-(editor._settings.get('viewport_inset_bottom')||0)-padding;

    if (w <= 0 || h <= 0) return null;
    return {x:x, y:y, width:w, height:h};
  };
  this.centerOnContent = function() {
    var bounds = this.getContentBounds();
    var view = this.getViewport();
    if (!bounds || !view) {
      this.center();
      return;
    }

    var scale = tree.scaleX;
    this.setCam(
      view.x+view.width/2-(bounds.x+bounds.width/2)*scale,
      view.y+view.height/2-(bounds.y+bounds.height/2)*scale
    );
  };
  this.fitToScreen = function() {
    var bounds = this.getContentBounds();
    var view = this.getViewport();
    if (!bounds || !view) {
      this.center();
      return;
    }

    this.zoom(getFitZoom(bounds, view));
    this.centerOnContent();
  };
  this.getLocalPoint = function(x, y) {
    if (typeof x == 'undefined') x = editor._game.mouse.x;
    if (typeof y == 'undefined') y = editor._game.mouse.y;
    return tree.globalToLocal(x, y);
  };

  this._applySettings = function(settings) {};
};

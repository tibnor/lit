# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [x.y.z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Removed -->
<!-- ### Fixed -->

## Unreleased

### Changed

- [Breaking] For consistency, renamed `_getUpdateComplete` to `getUpdateComplete`.
- [Breaking] When a property declaration is `reflect: true` and its `toAttribute` function returns `undefined` the attribute is now removed where previously it was left unchanged ([#872](https://github.com/Polymer/lit-element/issues/872)).
- Errors that occur during the update cycle were previously squelched to allow subsequent updates to proceed normally. Now errors are re-fired asynchronously so they can be detected. Errors can be observed via an `unhandledrejection` event handler on window.

- UpdatingElement's `renderRoot` is now created when the element's `connectedCallback` is initially run.

### Added

- Console warnings added for removed API and other element problems in developer mode. Some warnings are errors and are always issued while others are optional. Optional warnings can be configured per class via `MyElement.enable/disableWarning`. Making changes in update warns by default and can be toggled via `MyElement.disableWarning('change-in-update)`; migration warnings are off by default and can be toggled via `MyElement.enableWarning('migration')`.

- Added ability to add a controller to an element. A controller can implement callbacks that tie into element lifecycle, including `connectedCallback`, `disconnectedCallback`, `willUpdate`, `update`, and `didUpdate`. To ensure it has access to the element lifecycle, a controller should be added in the element's constructor. To add a controller to the element, call `addController(controller)`.

- Added `didUpdate(changedProperties)` lifecycle method to UpdatingElement. This is called after the `update` method and is the entry point from which the `firstUpdated` and `updated` methods are called. Note, user implementations of this method should call `super.didUpdate`.

- Added `willUpdate(changedProperties)` lifecycle method to UpdatingElement. This is called before the `update` method and can be used to compute derived state needed for updating. This method is intended to be called during server side rendering and should not manipulate element DOM. Note, user implementations of this method should call `super.willUpdate`.

- UpdatingElement moved from `lit-element` package to `updating-element` package.

### Removed

- [Breaking] Removed `requestUpdateInternal`. The `requestUpdate` method is now identical to this method and should be used instead.
- [Breaking] The `initialize` method has been removed. This work is now done in the element constructor.

### Fixed

- Fixes an issue with `queryAssignedNodes` when applying a selector on a slot that included text nodes on older browsers not supporting Element.matches [#1088](https://github.com/Polymer/lit-element/issues/1088).
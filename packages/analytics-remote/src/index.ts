// Module Federation requires the real entry point to be loaded asynchronously
// so the shared module scope can initialize before this app touches React.
import("./bootstrap");

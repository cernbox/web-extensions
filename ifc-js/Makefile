NAME := ifc-js

release: release/$(NAME).tar.gz

clean:
	rm -rf dist release node_modules

dist:
	pnpm install
	pnpm build

release/$(NAME).tar.gz: dist
	mkdir -p release
	tar -C dist -czf release/$(NAME).tar.gz .
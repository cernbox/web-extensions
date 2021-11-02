NAME := open-in-swan

release: release/$(NAME).tar.gz

clean:
	rm -rf dist release node_modules

dist:
	yarn install
	yarn build

release/$(NAME).tar.gz: dist
	mkdir -p release
	tar -C dist -czf release/$(NAME).tar.gz .
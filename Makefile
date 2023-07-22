
.PHONY: update-theme
update-theme:
	git submodule update --remote --merge

.PHONY: clean
clean:
	rm -rf public resources/_gen
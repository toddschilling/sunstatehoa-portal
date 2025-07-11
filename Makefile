.PHONY: install dev clean 

install:
	npm install --registry=https://registry.npmjs.org/

dev:
	@open http://local-hoa.sunstatehoa.com:3000 || xdg-open http://local-hoa.sunstatehoa.com:3000 || true
	npm run dev

clean:
	rm -rf node_modules .next
	@echo "🧹 Cleaned node_modules and .next directories"

.PHONY: install dev clean 

install:
	npm install --registry=https://registry.npmjs.org/

dev:
	@open http://local-hoa.sunstatehoa.com:3001 || xdg-open http://local-hoa.sunstatehoa.com:3001 || true
	PORT=3001 npm run dev

clean:
	rm -rf node_modules .next
	@echo "🧹 Cleaned node_modules and .next directories"

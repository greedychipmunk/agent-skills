# AngularJS Unit Testing Skill - Navigation Index

**Version**: 1.2 | **Last Updated**: January 10, 2026

## Quick Navigation

### 📚 **Main Documentation**
- [Skill Overview](../skill.md) - Complete skill documentation with Jasmine + Jest support

### 📖 **Resource Guides** (Comprehensive References)

#### Core References
- [AngularJS Testing Reference](./resources/angularjs-testing-reference.md) - Complete API reference for testing AngularJS components
- [Testing Patterns Guide](./resources/testing-patterns-guide.md) - 8+ proven testing patterns with examples

#### Advanced Topics
- [HTTP Mocking Guide](./resources/http-mocking-guide.md) - Complete guide to $httpBackend mocking
- [Mock Helpers & Spies](./resources/mock-helpers-guide.md) - Service mocking and spy techniques
- [Code Coverage Analysis](./resources/coverage-analysis-guide.md) - Coverage metrics and improvement strategies
- [Jest Migration Guide](./resources/jest-migration-guide.md) - Guide for moving from Jasmine to Jest

#### Best Practices
- [Best Practices Checklist](./resources/best-practices-checklist.md) - Quality assurance checklist and scoring

### 📝 **Test Templates** (Copy & Paste Ready)

- [controller.spec.js](./templates/controller.spec.js) - Full controller testing template (500+ lines)
- [service.spec.js](./templates/service.spec.js) - Full service testing template (600+ lines)
- [directive.spec.js](./templates/directive.spec.js) - Directive testing template
- [filter.spec.js](./templates/filter.spec.js) - Filter testing template
- [fixtures.js](./templates/fixtures.js) - Reusable test fixtures and helpers

### 🔧 **Scripts**

- [run-tests.sh](./scripts/run-tests.sh) - Test execution script with coverage support

---

## Getting Started

### For New AngularJS Projects
1. Read [Skill Overview](../skill.md)
2. Review [Testing Patterns Guide](./resources/testing-patterns-guide.md)
3. Use templates as starting points
4. Reference [Best Practices Checklist](./resources/best-practices-checklist.md)

### For Jasmine Users
1. Start with [AngularJS Testing Reference](./resources/angularjs-testing-reference.md)
2. Copy templates from `/templates/`
3. Follow [Testing Patterns Guide](./resources/testing-patterns-guide.md)

### For Jest Users
1. Read [Jest Migration Guide](./resources/jest-migration-guide.md)
2. Use Jest configuration section in [Skill Overview](../skill.md)
3. Adapt templates as needed

### For HTTP Testing
1. Follow [HTTP Mocking Guide](./resources/http-mocking-guide.md)
2. See examples in [service.spec.js](./templates/service.spec.js)

### For Coverage Analysis
1. Review [Code Coverage Analysis](./resources/coverage-analysis-guide.md)
2. Run tests with coverage: `./scripts/run-tests.sh --coverage`

---

## Common Tasks

| Task | Resource |
|------|----------|
| **Write controller tests** | [controller.spec.js](./templates/controller.spec.js) + [Testing Patterns](./resources/testing-patterns-guide.md) |
| **Write service tests** | [service.spec.js](./templates/service.spec.js) + [HTTP Mocking Guide](./resources/http-mocking-guide.md) |
| **Mock services** | [Mock Helpers Guide](./resources/mock-helpers-guide.md) + [fixtures.js](./templates/fixtures.js) |
| **Test HTTP calls** | [HTTP Mocking Guide](./resources/http-mocking-guide.md) |
| **Improve coverage** | [Code Coverage Analysis](./resources/coverage-analysis-guide.md) |
| **Quality assurance** | [Best Practices Checklist](./resources/best-practices-checklist.md) |
| **Migrate to Jest** | [Jest Migration Guide](./resources/jest-migration-guide.md) |
| **Run tests** | [run-tests.sh](./scripts/run-tests.sh) |

---

## Framework Comparison

### Jasmine (Traditional, Recommended for AngularJS 1.x)
- Browser-based testing via Karma
- Tight AngularJS integration
- Mature ecosystem
- See all Jasmine content throughout resources

### Jest (Modern, For New/Modern Projects)
- Node.js-based testing
- Fast parallel execution
- Built-in mocking and coverage
- Snapshot testing support
- See [Jest Migration Guide](./resources/jest-migration-guide.md)

---

## File Organization

```
angularjs-unit-testing-skill/
├── README.md                          (This file)
├── skill.md                            (Main documentation)
├── resources/                          (Comprehensive guides)
│   ├── angularjs-testing-reference.md
│   ├── testing-patterns-guide.md
│   ├── http-mocking-guide.md
│   ├── mock-helpers-guide.md
│   ├── coverage-analysis-guide.md
│   ├── jest-migration-guide.md
│   └── best-practices-checklist.md
├── templates/                          (Copy-paste ready templates)
│   ├── controller.spec.js             (500+ lines, fully commented)
│   ├── service.spec.js                (600+ lines, fully commented)
│   ├── directive.spec.js
│   ├── filter.spec.js
│   └── fixtures.js                    (Mock data and helpers)
└── scripts/                            (Automation)
    └── run-tests.sh                   (Test runner with coverage)
```

---

## Quick Reference

### Common Test Structure (Jasmine)
```javascript
describe('Component', function() {
  var component, $httpBackend;

  beforeEach(module('app'));
  beforeEach(inject(function(_Component_, _$httpBackend_) {
    component = _Component_;
    $httpBackend = _$httpBackend_;
  }));

  it('should do something', function() {
    expect(component).toBeDefined();
  });
});
```

### Common Test Structure (Jest)
```javascript
describe('Component', () => {
  let component;

  beforeEach(() => {
    component = new Component();
  });

  test('should do something', () => {
    expect(component).toBeDefined();
  });
});
```

---

## Documentation Stats

- **Total Documentation**: 27,500+ words
- **Code Examples**: 200+ examples with dual-framework support
- **Test Templates**: 5 production-ready templates (2,000+ lines)
- **Resource Guides**: 7 comprehensive guides
- **Test Patterns**: 8+ documented patterns
- **Coverage**: Jasmine + Jest support throughout

---

## Support & References

- [AngularJS Documentation](https://docs.angularjs.org/)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Jest Documentation](https://jestjs.io/)
- [Karma Test Runner](https://karma-runner.github.io/)
- [Istanbul/NYC Coverage](https://istanbul.js.org/)

---

## Version History

- **v1.2** - Added Jest migration guide and expanded mock helpers (Jan 10, 2026)
- **v1.1** - Added Jasmine + Jest dual-framework support (Jan 8, 2026)
- **v1.0** - Initial release with Jasmine-focused content (Jan 1, 2026)

---

**Need help?** Review the [Best Practices Checklist](./resources/best-practices-checklist.md) or start with a template matching your component type.
